import { DatabaseService } from './database.service';
import * as readline from 'readline';

async function askTableName(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('Please enter the table name: ', (tableName) => {
            rl.close();
            resolve(tableName);
        });
    });
}

async function main() {
    // Get the table name from the command line
    let tableName = process.argv[2];

    if (!tableName) {
        console.log('No table name provided as an argument.');
        tableName = await askTableName();
    }

    if (!tableName) {
        console.error('Table name is required. Exiting.');
        process.exit(1);
    }

    const databaseService = new DatabaseService();

    try {
        await databaseService.onModuleInit(); // Initialize the connection
        console.log(`Truncating table: ${tableName}`);
        await databaseService.$queryRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`); // Adjust this to match your actual truncate method
        console.log(`Table "${tableName}" truncated successfully.`);
    } catch (error) {
        console.error(`Error truncating table "${tableName}":`, error.message);
    } finally {
        await databaseService.$disconnect(); // Clean up the connection
    }
}

main();