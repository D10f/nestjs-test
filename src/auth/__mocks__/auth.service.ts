const accessToken = 'some token';

const userResponse = {
  user: {},
  accessToken,
};

export const AuthService = jest.fn().mockReturnValue({
  signup: jest.fn().mockReturnValue(userResponse),
  login: jest.fn().mockReturnValue(userResponse),
  logout: jest.fn().mockReturnValue(undefined),
  refresh: jest.fn().mockReturnValue({ accessToken }),
});
