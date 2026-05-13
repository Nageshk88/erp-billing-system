const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/itemsController');
const { authenticate, scrubCostData } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/items');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.get('/', scrubCostData, ctrl.list);
router.get('/:id', scrubCostData, ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/image', upload.single('image'), ctrl.uploadImage);

module.exports = router;
