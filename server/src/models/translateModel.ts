export type PayloadRequest = {
  language: string
  text: string
  needExplanation: boolean
  context: string
}

export type PayloadSaveRequest = {
  initialText: string
  translation: string
}

export type ResponseData = {
  status: string
  error: string
  content: string
}

export type Task = {
  id: string
  text: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type TasksData = {
  version: number
  lastMigration: string
  days: Record<string, Task[]>
}

export type CreateTaskRequest = {
  text: string
}

export type UpdateTaskRequest = {
  text?: string
  completed?: boolean
}

export type IncompleteTask = Task & {
  originalDate: string
}

export type TaskCountsByDate = Record<string, {
  total: number
  completed: number
  incomplete: number
}>
