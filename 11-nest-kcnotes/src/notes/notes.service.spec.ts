import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from '../notes/dto/create-note.dto';
import { JwtService } from '@nestjs/jwt';

describe('Notes (e2e)', () => {
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

    // Create a test user and get JWT token
    const user = await prismaService.user.create({
      data: {
        username: 'testuser',
        password: 'password', // assuming you have plain text password storage for testing purposes; otherwise, hash it.
      },
    });
    token = await jwtService.signAsync({ id: user.id });
  });

  afterAll(async () => {
    await prismaService.note.deleteMany(); // First, delete all notes
    await prismaService.user.deleteMany(); // Then, delete all users
    await app.close();
  });

  it('/notes (POST)', async () => {
    const createNoteDto: CreateNoteDto = {
      title: 'Test Note',
      content: 'This is a test note',
    };
    const response = await request(app.getHttpServer())
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send(createNoteDto)
      .expect(201);

    expect(response.body.title).toBe(createNoteDto.title);
  });

  it('/notes (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/notes')
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
  });

  it('/notes/:id (GET)', async () => {
    const note = await prismaService.note.create({
      data: {
        title: 'Test Note 2',
        content: 'This is another test note',
        userId: (jwtService.decode(token) as any).id,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/notes/${note.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.title).toBe(note.title);
  });

  it('/notes/:id (PATCH)', async () => {
    const note = await prismaService.note.create({
      data: {
        title: 'Test Note 3',
        content: 'This is yet another test note',
        userId: (jwtService.decode(token) as any).id,
      },
    });

    const updatedNoteDto: CreateNoteDto = {
      title: 'Updated Note',
      content: 'This is an updated test note',
    };

    const response = await request(app.getHttpServer())
      .patch(`/notes/${note.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedNoteDto)
      .expect(200);

    expect(response.body.title).toBe(updatedNoteDto.title);
  });

  it('/notes/:id (DELETE)', async () => {
    const note = await prismaService.note.create({
      data: {
        title: 'Test Note 4',
        content: 'This is another test note to delete',
        userId: (jwtService.decode(token) as any).id,
      },
    });

    await request(app.getHttpServer())
      .delete(`/notes/${note.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const deletedNote = await prismaService.note.findUnique({
      where: { id: note.id },
    });
    expect(deletedNote).toBeNull();
  });
});
