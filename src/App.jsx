import { useState, useEffect } from "react";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { collection, getDocs, addDoc, query, where, doc, updateDoc, increment } from "firebase/firestore";
import { firestore } from "./firebase";
import { analytics } from './firebase';

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
      await analytics.logEvent('image_view', { image_url: imageUrl });

      // Construct the document reference using the image ID
      const imageRef = doc(firestore, "images", imageUrl.split("/").pop());

      // Update views counter in Firestore
      await updateDoc(imageRef, { views: increment(1) });
    } catch (error) {
      console.error("Error updating views counter:", error);
    }
  };

  const handleCopyImageUrl = (imageUrl) => {
    navigator.clipboard.writeText(imageUrl)
      .then(() => {
        alert("Image URL copied to clipboard!");
      })
      .catch((error) => {
        console.error("Error copying image URL:", error);
      });
  };

  return (
    <div className="p-8">
    <input type="file" onChange={handleImageChange} className="mb-4" />
    <button onClick={handleUpload} className="bg-blue-500 text-white py-2 px-4 rounded-md mr-4">Upload Image</button>
    <div className="flex flex-wrap">
      {images.map((image, index) => (
        <div key={index} className="flex flex-col items-center mr-4 mb-4">
          <img
            className="h-auto max-w-md mb-2"
            src={image.imageUrl}
            alt={`Uploaded ${index}`}
            style={{ maxHeight: "200px" }}
            onClick={() => handleImageView(image.imageUrl)} // Track image view
          />
          <button onClick={() => handleCopyImageUrl(image.imageUrl)} className="bg-gray-500 text-white py-1 px-2 rounded-md">Copy Image Link</button>
          <p className="mt-2">Views: {image.views}</p>
        </div>
      ))}
    </div>
  </div>
  )  
}

export default App;
