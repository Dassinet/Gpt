const express = require('express');
const multer = require('multer');
const { 
  createCustomGpt, 
  getAllCustomGpts, 
  getCustomGptById, 
  updateCustomGpt, 
  deleteCustomGpt,
  assignGptToUser,
  getAssignedGpts,
  getCustomGptTools,
  updateCustomGptTools,
  getUserAssignedGptById,
  addToFavourites,
  getFavourites,
  removeFromFavourites
} = require('../controllers/gptController');
const { protectRoute, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for image field'), false);
      }
    } else if (file.fieldname === 'knowledgeFiles') {
      const allowedTypes = ['application/pdf', 'text/plain', 'application/json', 'application/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, TXT, JSON, and CSV files are allowed for knowledge files'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

router.post('/create', protectRoute, restrictTo('admin'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'knowledgeFiles', maxCount: 10 }
]), createCustomGpt);

router.get('/all', protectRoute, restrictTo('admin'), getAllCustomGpts);
router.get('/:id', protectRoute, restrictTo('admin'), getCustomGptById);

// New route for users to access their assigned GPTs
router.get('/user/:id', protectRoute, getUserAssignedGptById);

router.put('/:id', protectRoute, restrictTo('admin'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'knowledgeFiles', maxCount: 10 }
]), updateCustomGpt);

router.delete('/:id', protectRoute, restrictTo('admin'), deleteCustomGpt);
router.get('/:id/tools', protectRoute, restrictTo('admin'), getCustomGptTools);
router.post('/:id/tools', protectRoute, restrictTo('admin'), updateCustomGptTools);
router.post('/:id/favourites', protectRoute, restrictTo('user'), addToFavourites);
router.get('/favourites/:userId', protectRoute, restrictTo('user'), getFavourites);
router.delete('/favourites/:gptId', protectRoute, restrictTo('user'), removeFromFavourites); 
router.post('/assign/:id', protectRoute, restrictTo('admin'), assignGptToUser);
router.get('/assigned/:id', protectRoute, getAssignedGpts);


module.exports = router;