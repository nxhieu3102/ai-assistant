import { Router } from 'express'
import TaskController from '../controllers/TaskController'

const router = Router()
const controller = new TaskController()

// GET /tasks?date=YYYY-MM-DD - List tasks for date (optional, defaults to today)
router.get('/', controller.getTasks)

// POST /tasks - Create a new task
router.post('/', controller.createTask)

// PUT /tasks/:id - Update task (text and/or completed status)
router.put('/:id', controller.updateTask)

// DELETE /tasks/:id - Delete task
router.delete('/:id', controller.deleteTask)

// POST /tasks/migrate - Manual migration trigger (for debugging/admin)
router.post('/migrate', controller.migrateTasks)

export default router
