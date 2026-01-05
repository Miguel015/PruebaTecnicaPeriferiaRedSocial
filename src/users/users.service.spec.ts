import { UsersService } from './users.service';

const makeMockRepo = (overrides = {}) => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  ...overrides
});

describe('UsersService (unit)', () => {
  let usersRepo: any;
  let svc: UsersService;

  beforeEach(() => {
    usersRepo = makeMockRepo();
    svc = new UsersService(usersRepo);
  });

  test('findByUsername forwards to repo', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'u1', username: 'alice' });
    const r = await svc.findByUsername('alice');
    expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { username: 'alice' } });
    expect(r).not.toBeNull();
    expect((r as any).username).toBe('alice');
  });

  test('create uses repo create+save', async () => {
    usersRepo.create.mockReturnValue({ username: 'bob' });
    usersRepo.save.mockResolvedValue({ id: 'u2', username: 'bob' });
    const r = await svc.create({ username: 'bob' } as any);
    expect(usersRepo.create).toHaveBeenCalled();
    expect(usersRepo.save).toHaveBeenCalled();
    expect(r.id).toBe('u2');
  });
});
