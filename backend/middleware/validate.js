const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message),
    });
  }
  next();
};

// Auth schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Student schemas
const studentSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  roll_no: Joi.string().max(50).required(),
  enrollment_no: Joi.string().max(50).required(),
  department: Joi.string().max(100).required(),
  program: Joi.string().max(100).allow('', null),
  specialization: Joi.string().max(100).allow('', null),
  year: Joi.number().integer().min(1).max(6).allow(null),
  semester: Joi.number().integer().min(1).max(12).allow(null),
  section: Joi.string().max(10).allow('', null),
  email: Joi.string().email().allow('', null),
  contact: Joi.string().max(20).allow('', null),
  address: Joi.string().allow('', null),
  exam_type: Joi.string().max(50).allow('', null),
});

// Room schemas
const roomSchema = Joi.object({
  room_no: Joi.string().max(50).required(),
  capacity: Joi.number().integer().min(1).required(),
  benches: Joi.number().integer().min(1).required(),
  floor: Joi.string().max(20).allow('', null),
  block: Joi.string().max(20).allow('', null),
  teacher_name: Joi.string().max(150).allow('', null),
});

// Exam schemas
const examSchema = Joi.object({
  title: Joi.string().max(200).required(),
  subject: Joi.string().max(150).allow('', null),
  exam_date: Joi.date().required(),
  shift: Joi.string().valid('Morning', 'Afternoon', 'Evening').required(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
  department: Joi.string().max(100).allow('', null),
  semester: Joi.number().integer().min(1).max(12).allow(null),
});

// Seating generate schema
const generateSchema = Joi.object({
  exam_id: Joi.number().integer().required(),
  room_ids: Joi.array().items(Joi.number().integer()).min(1).required(),
});

module.exports = {
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    student: studentSchema,
    room: roomSchema,
    exam: examSchema,
    generate: generateSchema,
  },
};
