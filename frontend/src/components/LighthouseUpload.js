import React from "react";

const LighthouseUpload = ({ walletAddress }) => {
  // Upload file to backend
  const uploadFile = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    // Optionally append wallet address if you want the server to know it
    if (walletAddress) {
      formData.append("walletAddress", walletAddress);
    }

    try {
      const res = await fetch("http://localhost:5002/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Uploaded:", data);
      alert("File uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Check console for details.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>🚀 Upload File to Lighthouse</h2>
      <input type="file" onChange={uploadFile} />
    </div>
  );
};

export default LighthouseUpload;
