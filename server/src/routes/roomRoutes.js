const express = require('express');
const router = express.Router();
const {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.route('/')
  .get(getRooms)
  .post(authorize('coordinator'), createRoom);

router.route('/:id')
  .patch(authorize('coordinator'), updateRoom)
  .delete(authorize('coordinator'), deleteRoom);

module.exports = router;
