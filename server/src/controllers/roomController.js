const InterviewRoom = require('../models/InterviewRoom');
const AuditLog = require('../models/AuditLog');

// @desc    Get all interview rooms / venues
// @route   GET /api/rooms
const getRooms = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const rooms = await InterviewRoom.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new room or virtual venue
// @route   POST /api/rooms
const createRoom = async (req, res, next) => {
  try {
    const { name, capacity, isVirtual, location, meetingLink, equipment } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room / Venue name is required.'
      });
    }

    const existing = await InterviewRoom.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A venue or room with this name already exists.'
      });
    }

    let equipmentList = [];
    if (Array.isArray(equipment)) {
      equipmentList = equipment;
    } else if (typeof equipment === 'string') {
      equipmentList = equipment.split(',').map(e => e.trim()).filter(Boolean);
    }

    const room = await InterviewRoom.create({
      name,
      capacity: Number(capacity) || 4,
      isVirtual: !!isVirtual,
      location: location || 'Main Campus',
      meetingLink: meetingLink || '',
      equipment: equipmentList
    });

    await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ROOM_CREATED',
      entityType: 'InterviewRoom',
      entityId: room._id.toString(),
      details: { roomName: room.name, isVirtual: room.isVirtual }
    });

    res.status(201).json({
      success: true,
      message: 'Interview room created successfully.',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details
// @route   PATCH /api/rooms/:id
const updateRoom = async (req, res, next) => {
  try {
    const { name, capacity, isVirtual, location, meetingLink, equipment, isActive } = req.body;

    const room = await InterviewRoom.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.'
      });
    }

    if (name) room.name = name;
    if (capacity !== undefined) room.capacity = Number(capacity);
    if (isVirtual !== undefined) room.isVirtual = isVirtual;
    if (location !== undefined) room.location = location;
    if (meetingLink !== undefined) room.meetingLink = meetingLink;
    if (equipment !== undefined) {
      room.equipment = Array.isArray(equipment) ? equipment : equipment.split(',').map(e => e.trim()).filter(Boolean);
    }
    if (isActive !== undefined) room.isActive = isActive;

    await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully.',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or deactivate room
// @route   DELETE /api/rooms/:id
const deleteRoom = async (req, res, next) => {
  try {
    const room = await InterviewRoom.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.'
      });
    }

    room.isActive = false;
    await room.save();

    res.json({
      success: true,
      message: 'Room deactivated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom
};
