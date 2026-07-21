export const successResponse = (res, message, data = {}) => {
  return res.status(200).json({ success: true, message, data });
};

export const createdResponse = (res, message, data = {}) => {
  return res.status(201).json({ success: true, message, data });
};

export const errorResponse = (res, status, message, error = {}) => {
  return res.status(status).json({ success: false, message, error });
};
