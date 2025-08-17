import { Request, Response } from 'express'
import { CreateTaskRequest, UpdateTaskRequest } from '../models/translateModel'
import TaskService from '../services/TaskService'

class TaskController {
  private taskService: TaskService

  constructor() {
    this.taskService = new TaskService()
  }

  public getTasks = async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string
      
      const result = await this.taskService.getTasksForDate(date)
      res.json(result)
    } catch (error) {
      console.error('Error in getTasks:', error)
      res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        content: ''
      })
    }
  }

  public createTask = async (req: Request, res: Response) => {
    try {
      const request: CreateTaskRequest = {
        text: req.body.text
      }
      const date = req.query.date as string
      
      const result = await this.taskService.createTask(request, date)
      res.json(result)
    } catch (error) {
      console.error('Error in createTask:', error)
      res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        content: ''
      })
    }
  }

  public updateTask = async (req: Request, res: Response) => {
    try {
      const taskId = req.params.id
      const request: UpdateTaskRequest = {
        text: req.body.text,
        completed: req.body.completed
      }
      const date = req.query.date as string
      
      const result = await this.taskService.updateTask(taskId, request, date)
      res.json(result)
    } catch (error) {
      console.error('Error in updateTask:', error)
      res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        content: ''
      })
    }
  }

  public deleteTask = async (req: Request, res: Response) => {
    try {
      const taskId = req.params.id
      const date = req.query.date as string
      
      const result = await this.taskService.deleteTask(taskId, date)
      res.json(result)
    } catch (error) {
      console.error('Error in deleteTask:', error)
      res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        content: ''
      })
    }
  }

  public migrateTasks = async (req: Request, res: Response) => {
    try {
      const result = await this.taskService.migrateUnfinishedTasks()
      res.json(result)
    } catch (error) {
      console.error('Error in migrateTasks:', error)
      res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        content: ''
      })
    }
  }

  public getTaskCountsByDate = async (req: Request, res: Response) => {
    try {
      const result = await this.taskService.getTaskCountsByDate()
      res.json(result)
    } catch (error) {
      console.error('Error in getTaskCountsByDate:', error)
      res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        content: ''
      })
    }
  }

  public getIncompleteTasks = async (req: Request, res: Response) => {
    try {
      const result = await this.taskService.getIncompleteTasks()
      res.json(result)
    } catch (error) {
      console.error('Error in getIncompleteTasks:', error)
      res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        content: ''
      })
    }
  }
}

export default TaskController
