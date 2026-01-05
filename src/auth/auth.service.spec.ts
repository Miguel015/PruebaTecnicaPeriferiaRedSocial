import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

const makeUsersService = (overrides = {}) => ({ usersRepo: { findOne: jest.fn() }, ...overrides });
const makeJwt = () => ({ sign: jest.fn().mockReturnValue('signed-token') });

describe('AuthService (unit)', () => {
  let usersService: any;
  let jwt: any;
  let svc: AuthService;

  beforeEach(() => {
    usersService = makeUsersService();
    jwt = makeJwt();
    svc = new AuthService(usersService, jwt as any);
  });

  test('validateUser returns null when user missing or wrong password', async () => {
    usersService.usersRepo.findOne.mockResolvedValue(null);
    const r1 = await svc.validateUser('noone', 'p');
    expect(r1).toBeNull();

    usersService.usersRepo.findOne.mockResolvedValue({ id: 'u1', passwordHash: 'h' });
    jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(false);
    const r2 = await svc.validateUser('u1', 'bad');
    expect(r2).toBeNull();
  });

  test('validateUser returns user when password matches', async () => {
    const user = { id: 'u2', username: 'alice', passwordHash: 'h' };
    usersService.usersRepo.findOne.mockResolvedValue(user);
    jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(true);
    const r = await svc.validateUser('alice', 'pwd');
    expect(r).toBe(user);
  });

  test('login returns access_token', async () => {
    const user = { id: 'u3', username: 'bob' };
    const res = await svc.login(user as any);
    expect(res.access_token).toBe('signed-token');
    expect(jwt.sign).toHaveBeenCalled();
  });
});
