export default {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
};

export const User = function (data) {
  Object.assign(this, data);
  this.save = jest.fn().mockResolvedValue(this);
  return this;
};
