"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef} from "react";
import { Redo2, Camera } from 'lucide-react';
import Webcam from "react-webcam";

interface Location {
  latitude: number;
  longitude: number;
}

const Report: React.FC = () => {
  const [location, setLocation] = useState<Location | undefined>();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [showCaptureButton, setShowCaptureButton] = useState(true);

  const router = useRouter();
  useEffect(() => {
    if ("geolocation" in navigator) {
      // Retrieve latitude & longitude coordinates from `navigator.geolocation` Web API
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { latitude, longitude } = coords;
        setLocation({ latitude, longitude });
        console.log("Latitude:", latitude, "Longitude:", longitude);
      });
    }
  }, []);

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setShowCaptureButton(false); // Hide capture button after capturing image
    }
  };

  const retakeImage = () => {
    setCapturedImage(null); // Reset captured image
    setShowCaptureButton(true); // Show capture button again
  };

  const submitReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!capturedImage) {
      console.error("No image captured!");
      return;
    }

    const formData = new FormData(event.currentTarget);

    // Convert the data URL to a Blob
    const dataUrl = capturedImage;
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
  
    formData.append("image", blob, "capturedImage.jpg");
    formData.append("latitude", location?.latitude.toString() || "");
    formData.append("longitude", location?.longitude.toString() || "");
    
    const token = localStorage.getItem("accessToken");
    fetch("http://localhost:8080/submit", {
      method: "POST",
      // mode: 'no-cors',
      credentials: "include",
      body: formData,
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => response.json())
      .then(async (data) => {
        console.log("Report submitted successfully:", data);
        router.push("/");
        // Handle success response
      })
      .catch((error) => {
        console.error("Error submitting report:", error);
        // Handle error response
      });
  };

  return (
    <div className="mx-auto w-full max-w-[400px] shadow-lg border-2 rounded-lg">
      <div className="text-center px-2 py-1">
        <p className="text-xl font-semibold">Report</p>
        <form onSubmit={submitReport} className="overflow-y-scroll">
          <div>
            <label htmlFor="title">Title</label>
            <input type="text" id="title" name="title" required />
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" required />
          </div>
          <div>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div>
            <label htmlFor="tags">Tags</label>
            <input type="text" id="tags" name="tags" />
          </div>
          <div>
            <label htmlFor="urgency">Urgency</label>
            <select name="urgency">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label htmlFor="severity">Severity</label>
            <select name="severity">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <input
            type="hidden"
            name="latitude"
            value={location?.latitude || ""}
          />
          <input
            type="hidden"
            name="longitude"
            value={location?.longitude || ""}
          />
          <div style={{ position: "relative", display: "inline-block" }}>
            {capturedImage ? (
              <div>
                <img
                  src={capturedImage}
                  alt="Captured"
                  style={{ height: "100px", width: "150px" }}
                />
                <button
                  type="button"
                  onClick={retakeImage}
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Redo2 size={30} />
                </button>
              </div>
            ) : (
              <div>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  style={{ height: "100px", width: "150px" }}
                />
                <button
                  type="button"
                  onClick={captureImage}
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Camera size={30} />
                </button>
              </div>
            )}
          </div>
          <div>
            <input type="submit" value="Submit" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Report;
