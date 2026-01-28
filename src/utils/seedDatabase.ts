
import { resourceService } from '../services/resourceService';
import { noteService } from '../services/noteService';

export const seedDatabase = async (userId: string) => {
    console.log("Seeding database for user:", userId);

    // 1. Create a YouTube Resource
    const yi = await resourceService.addResource(
        userId,
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Classic example
        'Introduction to Research Methods (Demo)',
        ['research', 'demo']
    );

    // 2. Create a "Drive" Resource (Simulated)
    await resourceService.addResource(
        userId,
        'https://drive.google.com/file/d/123456789/view',
        'Advanced Constitutional Law (Archive)',
        ['law', 'archive']
    );

    // 3. Create a Note linked to the YouTube video
    await noteService.addNote(
        userId,
        'Notes on Research Methods',
        '# Key Takeaways\n\n- Research is **systematic**.\n- Only rely on verified sources.\n\nSee [[Advanced Constitutional Law (Archive)]] for cross-reference.',
        yi.id
    );

    // 4. Create a standalone Note / Transcript
    await noteService.addNote(
        userId,
        'Voice Memo: Thesis Idea',
        'The intersection of digital media and cognitive retention is fascinating. I should explore this further in the next chapter.',
        undefined
    );

    console.log("Database seeded successfully!");
    return true;
};
