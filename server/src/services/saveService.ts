import { PayloadSaveRequest, ResponseData } from 'src/models/translateModel'
import * as dotenv from 'dotenv'
import SaveRepo from 'src/repository/saveRepo'
dotenv.config()

class SaveService {
  public save = async (payload: PayloadSaveRequest): Promise<ResponseData> => {
    try {
        const saveRepo = new SaveRepo('../temp/data.json');
        saveRepo.save(payload);
        return {
            status: 'success',
            error: '',
            content: ''
        } as ResponseData
    } catch (error) {
        console.error('Error when save data', error)
        return {
            status: 'error',
            error: 'Error when save data',
            content: ''
        } as ResponseData
    }
  }
}

export default SaveService
