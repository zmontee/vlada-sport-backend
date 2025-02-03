import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const rootDirName = path.basename(path.resolve(__dirname, '..'));

export default rootDirName;
