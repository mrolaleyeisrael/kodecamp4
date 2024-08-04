import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('NotesService', () => {
  let notesService: NotesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotesService, PrismaService],
    }).compile();

    notesService = module.get<NotesService>(NotesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createNote', () => {
    it('should throw an error if note title already exists', async () => {
      const createNoteDto = { title: 'Existing Note', content: 'Content' };
      jest
        .spyOn(prismaService.note, 'findUnique')
        .mockResolvedValue(createNoteDto as any);

      await expect(
        notesService.createNote(createNoteDto, 'userId'),
      ).rejects.toThrow(
        new BadRequestException({
          message: `Note with title '${createNoteDto.title}' already exists.`,
        }),
      );
    });

    it('should create and return a note', async () => {
      const createNoteDto = { title: 'New Note', content: 'Content' };
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.note, 'create')
        .mockResolvedValue(createNoteDto as any);

      const result = await notesService.createNote(createNoteDto, 'userId');
      expect(result).toEqual(createNoteDto);
    });
  });

  describe('getNotes', () => {
    it('should return an array of notes', async () => {
      const notes = [{ title: 'Note 1', content: 'Content' }];
      jest
        .spyOn(prismaService.note, 'findMany')
        .mockResolvedValue(notes as any);

      const result = await notesService.getNotes();
      expect(result).toEqual(notes);
    });
  });

  describe('getNote', () => {
    it('should throw an error if note is not found', async () => {
      jest.spyOn(prismaService.note, 'findFirst').mockResolvedValue(null);

      await expect(notesService.getNote('noteId', 'userId')).rejects.toThrow(
        new BadRequestException({ message: 'Note not found' }),
      );
    });

    it('should return the note', async () => {
      const note = { id: 'noteId', title: 'Note', content: 'Content' };
      jest
        .spyOn(prismaService.note, 'findFirst')
        .mockResolvedValue(note as any);

      const result = await notesService.getNote('noteId', 'userId');
      expect(result).toEqual(note);
    });
  });

  describe('updateNote', () => {
    it('should throw an error if note is not found', async () => {
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(null);

      await expect(
        notesService.updateNote(
          {
            title: 'Updated',
            content: '',
          },
          'noteId',
          'userId',
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: `Note with id 'noteId' not found.`,
        }),
      );
    });

    it('should update and return the note', async () => {
      const note = {
        id: 'noteId',
        title: 'Updated',
        content: 'Updated content',
      };
      jest
        .spyOn(prismaService.note, 'findUnique')
        .mockResolvedValue(note as any);
      jest.spyOn(prismaService.note, 'update').mockResolvedValue(note as any);

      const result = await notesService.updateNote(
        { title: 'Updated', content: 'Updated content' },
        'noteId',
        'userId',
      );
      expect(result).toEqual(note);
    });
  });

  describe('deleteNote', () => {
    it('should throw an error if note is not found', async () => {
      jest.spyOn(prismaService.note, 'findUnique').mockResolvedValue(null);

      await expect(notesService.deleteNote('noteId', 'userId')).rejects.toThrow(
        new BadRequestException({
          message: `Note with id 'noteId' not found.`,
        }),
      );
    });

    it('should delete and return the note', async () => {
      const note = { id: 'noteId', title: 'Note', content: 'Content' };
      jest
        .spyOn(prismaService.note, 'findUnique')
        .mockResolvedValue(note as any);
      jest.spyOn(prismaService.note, 'delete').mockResolvedValue(note as any);

      const result = await notesService.deleteNote('noteId', 'userId');
      expect(result).toEqual(note);
    });
  });
});
