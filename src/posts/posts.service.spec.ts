import { PostsService } from './posts.service';

// Minimal mocks for TypeORM repositories
const makeMockRepo = (overrides = {}) => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  delete: jest.fn(),
  ...overrides
});

describe('PostsService (unit)', () => {
  let postsRepo: any;
  let likesRepo: any;
  let usersRepo: any;
  let svc: PostsService;

  beforeEach(() => {
    postsRepo = makeMockRepo();
    likesRepo = makeMockRepo();
    usersRepo = makeMockRepo();
    svc = new PostsService(postsRepo, likesRepo, usersRepo);
  });

  test('like: creates a like when none exists', async () => {
    const postId = 'post-1';
    const user = { id: 'user-1' };
    postsRepo.findOne.mockResolvedValue({ id: postId });
    likesRepo.findOne.mockResolvedValue(null);
    likesRepo.save.mockResolvedValue({ postId, userId: user.id });
    likesRepo.count.mockResolvedValue(1);

    const res = await svc.like(postId, user);
    expect(res.liked).toBe(true);
    expect(res.totalLikes).toBe(1);
    expect(likesRepo.save).toHaveBeenCalled();
  });

  test('like: removes existing like when present', async () => {
    const postId = 'post-2';
    const user = { id: 'user-2' };
    postsRepo.findOne.mockResolvedValue({ id: postId });
    const existing = { id: 'like-1', postId, userId: user.id };
    likesRepo.findOne.mockResolvedValue(existing);
    likesRepo.remove.mockResolvedValue(existing);
    likesRepo.count.mockResolvedValue(0);

    const res = await svc.like(postId, user);
    expect(res.liked).toBe(false);
    expect(res.totalLikes).toBe(0);
    expect(likesRepo.remove).toHaveBeenCalledWith(existing);
  });

  test('cleanupOrphans: deletes posts whose author missing', async () => {
    const orphan = { id: 'p1', authorId: 'missing', images: JSON.stringify(['/uploads/img1.jpg']) };
    postsRepo.find.mockResolvedValue([orphan]);
    usersRepo.findOne.mockResolvedValue(null);
    likesRepo.delete.mockResolvedValue({});
    postsRepo.delete.mockResolvedValue({});

    const res = await svc.cleanupOrphans();
    expect(res.removed).toBeGreaterThanOrEqual(1);
    expect(likesRepo.delete).toHaveBeenCalled();
    expect(postsRepo.delete).toHaveBeenCalledWith({ id: orphan.id });
  });
});
