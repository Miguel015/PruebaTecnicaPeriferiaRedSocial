import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'

describe('Posts E2E', () => {
  let app: INestApplication

  beforeAll(async () => {
    // force AppModule to use sqlite in-memory/dev file by setting env
    process.env.NODE_ENV = 'development'
    process.env.DB_HOST = 'postgres'
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  }, 20000)

  afterAll(async () => {
    if (app) await app.close()
  })

  test('login -> create post -> like -> cleanup orphans', async () => {
    // login using seeded user 'alice' (seed created passwords like password1)
    const loginRes = await request(app.getHttpServer()).get('/auth/login').query({ username: 'alice', password: 'password1' }).expect(200)
    const token = loginRes.body.access_token || loginRes.body.token || null
    expect(token).toBeTruthy()

    // create a post
    const createRes = await request(app.getHttpServer()).post('/posts').set('Authorization', `Bearer ${token}`).send({ content: 'e2e-test-post' })
    const postId = createRes.body.id
    expect(postId).toBeTruthy()

    // like the post
    const likeRes = await request(app.getHttpServer()).post(`/posts/${postId}/like`).set('Authorization', `Bearer ${token}`)
    expect([200,201]).toContain(likeRes.status)
    expect(typeof likeRes.body.totalLikes).toBe('number')

    // call cleanup endpoint (protected)
    const cleanupRes = await request(app.getHttpServer()).delete('/posts/cleanup-orphans').set('Authorization', `Bearer ${token}`).expect(200)
    // cleanup may return an object with removed count or message; assert success
    expect(cleanupRes.body).toBeDefined()
  }, 30000)
})
