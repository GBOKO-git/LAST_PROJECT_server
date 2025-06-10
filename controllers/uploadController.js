const { dataUri } = require("../middleware/upload");
const { cloudinary } = require("../config/cloudinary");

// const uploadImage = async (req, res) => {
//   if (req.file) {
//     const file = dataUri(req.file).content;
//     try {
//       const result = await cloudinary.uploader.upload(file, {
//         folder: 'monprojet/images',
//       });
//       res.json({ imageUrl: result.secure_url });
//     } catch (error) {
//       res.status(500).json({ error: 'Upload échoué', details: error });
//     }
//   } else {
//     res.status(400).json({ error: 'Aucun fichier fourni' });
//   }
// };

 const uploadImage = async (req, res) => {
  console.log("Requête reçue pour uploadImage");
  if (!req.file) {
    console.log("Aucun fichier reçu");
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }

  try {
    const file = dataUri(req.file).content;
    console.log("Données du fichier transformées en dataUri");
    
    const result = await cloudinary.uploader.upload(file, {
      folder: 'monprojet/images',
    });
    console.log("Upload vers Cloudinary réussi:", result.secure_url);

    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: 'Upload échoué', details: error.message });
  }
};


module.exports = { uploadImage };
