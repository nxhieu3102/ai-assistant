import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Data {
    [key: string]: any;
}

class SaveRepo {
    private filePath: string;

    constructor(fileName: string) {
        console.log(__dirname);
        this.filePath = path.join(__dirname, fileName);
    }

    public save(data: Data): void {
        const jsonData = JSON.stringify(data, null, 2);
        
        // If the file exists, append the new data.
        if (fs.existsSync(this.filePath)) {
            const existingContent = fs.readFileSync(this.filePath, 'utf-8');
            const updatedContent = existingContent + '\n' + jsonData;
            fs.writeFileSync(this.filePath, updatedContent, 'utf-8');
        } else {
            // Create the file and write data.
            fs.writeFileSync(this.filePath, jsonData, 'utf-8');
        }
    }

    public load(): Data {
        if (fs.existsSync(this.filePath)) {
            const fileContent = fs.readFileSync(this.filePath, 'utf-8');
            return JSON.parse(fileContent);
        }
        return {};
    }
}

export default SaveRepo;
