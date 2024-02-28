import { useState, useEffect } from "react";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { collection, getDocs, addDoc, query, where, doc, updateDoc, increment } from "firebase/firestore";
import { firestore } from "./firebase";
import 'firebase/analytics';


function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [images, setImages] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null);

  useEffect(() => {
    if (!userId) {
      const newUserId = uuidv4();
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
  }, [userId]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        if (!userId) return;

        const q = query(collection(firestore, "images"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const imagesData = snapshot.docs.map((doc) => doc.data());
        setImages(imagesData);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, [userId, selectedImage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
  };

  const handleUpload = () => {
    if (selectedImage === null || !userId) return;

    const imageId = uuidv4();
    const imageRef = ref(storage, `images/${imageId}`);

    uploadBytes(imageRef, selectedImage)
      .then(async () => {
        alert("Image uploaded successfully");

        const downloadUrl = await getDownloadURL(imageRef);

        await addDoc(collection(firestore, "images"), {
          imageUrl: downloadUrl,
          timestamp: new Date().toISOString(),
          userId: userId,
          views: 0 // Initialize views counter
        });

        setSelectedImage(null);
      })
      .catch((err) => {
        console.error("Error uploading image:", err);
        alert("Error uploading image. Please try again.");
      });
  };

  const handleImageView = async (imageUrl) => {
    try {
      // Trigger custom event for image view
      await firebase.analytics().logEvent('image_view', { image_url: imageUrl });
  
      // Construct the document reference using the image ID
      const imageRef = doc(firestore, "images", imageUrl.split("/").pop());
  
      // Update views counter in Firestore
      await updateDoc(imageRef, { views: increment(1) });
    } catch (error) {
      console.error("Error updating views counter:", error);
    }
  };
  

  return (
    <div>
      <input type="file" onChange={handleImageChange} />
      <button onClick={handleUpload}>Upload Image</button>
      <div>
        {images.map((image, index) => (
          <div key={index}>
            <img
              className="h-auto max-w-md"
              src={image.imageUrl}
              alt={`Uploaded ${index}`}
              style={{ maxHeight: "200px" }}
              onClick={() => handleImageView(image.imageUrl)} // Track image view
            />
            <p>Image URL: {image.imageUrl}</p>
            <p>Views: {image.views}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
