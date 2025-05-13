import { readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Path to the seeder directory
const seederDir = join(__dirname, 'prisma', 'seeder');

// Get the optional file argument from the command line
const args = process.argv.slice(2);
const specifiedFile = args[0]; // First argument

// Read all TypeScript files from the seeder directory
const seedFiles = readdirSync(seederDir).filter((file) => file.endsWith('.ts'));

if (specifiedFile) {
  // Validate if the specified file exists
  if (!seedFiles.includes(specifiedFile)) {
    console.error(
      `Error: Specified file '${specifiedFile}' not found in ${seederDir}`,
    );
    process.exit(1);
  }

  // Run only the specified seed file
  const filePath = join(seederDir, specifiedFile);
  console.log(`Running seed file: ${filePath}`);
  execSync(`ts-node ${filePath}`, { stdio: 'inherit' });
} else {
  // Run all seed files
  seedFiles.forEach((file) => {
    const filePath = join(seederDir, file);
    console.log(`Running seed file: ${filePath}`);
    execSync(`ts-node ${filePath}`, { stdio: 'inherit' });
  });
}

console.log('Seeding completed!');
