import { useState, useEffect } from "react";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import getDownloadURL
import { v4 as uuidv4 } from "uuid";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore"; // Import addDoc and query
import { firestore } from "./firebase";

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [images, setImages] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null); // Retrieve userId from localStorage

  useEffect(() => {
    if (!userId) {
      // If userId doesn't exist in localStorage, generate a new one
      const newUserId = uuidv4();
      localStorage.setItem("userId", newUserId); // Store userId in localStorage
      setUserId(newUserId);
    }
  }, [userId]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        if (!userId) return; // Don't fetch images if userId is not available

        // Query only for images associated with the current user
        const q = query(collection(firestore, "images"), where("userId", "==", userId));

        const snapshot = await getDocs(q);
        const imagesData = snapshot.docs.map((doc) => doc.data());
        setImages(imagesData);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, [userId, selectedImage]); // Include userId and selectedImage as dependencies

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
  };

  const handleUpload = () => {
    if (selectedImage === null || !userId) return;

    const imageId = uuidv4(); // Generate a unique ID for the image
    const imageRef = ref(storage, `images/${imageId}`);

    uploadBytes(imageRef, selectedImage)
      .then(async () => {
        alert("Image uploaded successfully");

        // Get the download URL for the uploaded image
        const downloadUrl = await getDownloadURL(imageRef);

        // Store image metadata in Firestore, associate with the current user's userId
        await addDoc(collection(firestore, "images"), {
          imageUrl: downloadUrl,
          timestamp: new Date().toISOString(),
          userId: userId,
        });

        setSelectedImage(null);
      })
      .catch((err) => {
        console.error("Error uploading image:", err);
        alert("Error uploading image. Please try again.");
      });
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
            />
            <p>Image URL: {image.imageUrl}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
