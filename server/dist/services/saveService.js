import * as dotenv from 'dotenv';
import SaveRepo from 'src/repository/saveRepo';
dotenv.config();
class SaveService {
    save = async (payload) => {
        try {
            const saveRepo = new SaveRepo('../temp/data.json');
            saveRepo.save(payload);
            return {
                status: 'success',
                error: '',
                content: ''
            };
        }
        catch (error) {
            console.error('Error when save data', error);
            return {
                status: 'error',
                error: 'Error when save data',
                content: ''
            };
        }
    };
}
export default SaveService;
