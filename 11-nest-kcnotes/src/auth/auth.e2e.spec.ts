import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup-user.dto';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get(PrismaService);
    jwtService = app.get(JwtService);

    const user = await prismaService.user.create({
      data: {
        username: 'testuser',
        password: await bcrypt.hash('password', 10),
      },
    });
    token = await jwtService.signAsync({ id: user.id });
  });

  afterAll(async () => {
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('/auth/signup (POST)', () => {
    it('should create a new user and return a token', async () => {
      const signupDto: SignupDto = {
        username: 'newuser',
        password: 'newpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(201);

      expect(response.body.token).toBeDefined();
    });

    it('should throw an error if user already exists', async () => {
      const signupDto: SignupDto = {
        username: 'testuser',
        password: 'password',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(400);
    });
  });

  describe('/auth/signin (POST)', () => {
    it('should return a token if credentials are correct', async () => {
      const signinDto: SignupDto = {
        username: 'testuser',
        password: 'password',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signinDto)
        .expect(201);

      expect(response.body.token).toBeDefined();
    });

    it('should throw an error if credentials are incorrect', async () => {
      const signinDto: SignupDto = {
        username: 'wronguser',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signinDto)
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.username).toBe('testuser');
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('/auth/update (PUT)', () => {
    it('should update the user password', async () => {
      const updateUserDto = { password: 'newpassword' };

      const response = await request(app.getHttpServer())
        .put('/auth/update')
        .set('Authorization', `Bearer ${token}`)
        .send(updateUserDto)
        .expect(200);

      expect(response.body.message).toBe('Password updated successfully');
    });

    it('should return 401 if not authenticated', async () => {
      const updateUserDto = { password: 'newpassword' };

      await request(app.getHttpServer())
        .put('/auth/update')
        .send(updateUserDto)
        .expect(401);
    });
  });

  describe('/auth/signout (GET)', () => {
    it('should sign out the user', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/signout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.token).toBe(null);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer()).get('/auth/signout').expect(401);
    });
  });
});
