import { CreateItemForm, EditableSpan } from "@/common/components"
import { todolistsApi } from "@/features/todolists/api/todolistsApi"
import type { Todolist } from "@/features/todolists/api/todolistsApi.types"
import { type ChangeEvent, type CSSProperties, useEffect, useState } from "react"
import Checkbox from "@mui/material/Checkbox"
import { tasksApi } from "@/features/todolists/api/tasksApi.ts"
import { DomainTask, UpdateTaskModel } from "@/features/todolists/api/tasksApi.types.ts"
import { TaskStatus } from "@/common/enums"

export const AppHttpRequests = () => {
  const [todolists, setTodolists] = useState<Todolist[]>([])
  const [tasks, setTasks] = useState<Record<string, DomainTask[]>>({})

  // useEffect(() => {
  //   todolistsApi.getTodolists().then((res) => {
  //     const todolists = res.data
  //     setTodolists(todolists)
  //     todolists.forEach((todolist) => {
  //       tasksApi.getTasks(todolist.id).then((res) => {
  //         const newTask = res.data.items
  //         setTasks({ ...tasks, [todolist.id]: newTask })
  //       })
  //     })
  //   })
  // }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todolistsResponse = await todolistsApi.getTodolists()
        const todolists = todolistsResponse.data
        setTodolists(todolists)

        const tasksPromises = todolists.map((todolist) => tasksApi.getTasks(todolist.id))
        const tasksResponses = await Promise.all(tasksPromises)

        const allTasks: Record<string, DomainTask[]> = {}
        tasksResponses.forEach((res, index) => {
          allTasks[todolists[index].id] = res.data.items
        })

        setTasks(allTasks)
      } catch (error) {
        console.error("Ошибка при загрузке todolists и задач:", error)
      }
    }

    fetchData()
  }, [])

  const createTodolist = (title: string) => {
    todolistsApi.createTodolist(title).then((res) => {
      const newTodolist = res.data.data.item
      setTodolists([newTodolist, ...todolists])
    })
  }

  const deleteTodolist = (id: string) => {
    todolistsApi.deleteTodolist(id).then(() => setTodolists(todolists.filter((todolist) => todolist.id !== id)))
  }

  const changeTodolistTitle = (id: string, title: string) => {
    todolistsApi.changeTodolistTitle({ id, title }).then(() => {
      setTodolists(todolists.map((todolist) => (todolist.id === id ? { ...todolist, title } : todolist)))
    })
  }

  const createTask = (todolistId: string, title: string) => {
    tasksApi.createTask({ todolistId, title }).then((res) => {
      const newTask = res.data.data.item
      setTasks({ ...tasks, [todolistId]: [newTask, ...(tasks[todolistId] || [])] })
    })
  }

  const deleteTask = (todolistId: string, taskId: string) => {
    tasksApi.deleteTask({ todolistId, taskId }).then(() => {
      setTasks((prevTasks) => ({
        ...prevTasks,
        [todolistId]: prevTasks[todolistId].filter((task) => task.id !== taskId),
      }))
    })
  }

  const changeTaskStatus = (e: ChangeEvent<HTMLInputElement>, task: any) => {
    const model: UpdateTaskModel = {
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      startDate: task.startDate,
      priority: task.priority,
      status: e.target.checked ? TaskStatus.Completed : TaskStatus.New,
    }
    tasksApi.changeTask({ todolistId: task.todoListId, taskId: task.id, model }).then((res) => {
      const updatedTask = res.data.data.item
      setTasks({
        ...tasks,
        [task.todoListId]: tasks[task.todoListId].map((el) => (el.id === task.id ? updatedTask : el)),
      })
    })
  }

  const changeTaskTitle = (task: DomainTask, title: string) => {
    const model: UpdateTaskModel = {
      title,
      description: task.description,
      deadline: task.deadline,
      startDate: task.startDate,
      priority: task.priority,
      status: task.status,
    }

    tasksApi
      .changeTask({ todolistId: task.todoListId, taskId: task.id, model })
      .then((res) => {
        const updatedTask = res.data.data.item
        setTasks((prev) => ({
          ...prev,
          [task.todoListId]: (prev[task.todoListId] || []).map((t) => (t.id === task.id ? updatedTask : t)),
        }))
      })
      .catch((err) => {
        console.error("changeTaskTitle failed:", err)
      })
  }
  return (
    <div style={{ margin: "20px" }}>
      <CreateItemForm onCreateItem={createTodolist} />
      {todolists.map((todolist) => (
        <div key={todolist.id} style={container}>
          <div>
            <EditableSpan value={todolist.title} onChange={(title) => changeTodolistTitle(todolist.id, title)} />
            <button onClick={() => deleteTodolist(todolist.id)}>x</button>
          </div>
          <CreateItemForm onCreateItem={(title) => createTask(todolist.id, title)} />
          {tasks[todolist.id]?.map((task: any) => (
            <div key={task.id}>
              <Checkbox checked={task.status === TaskStatus.Completed} onChange={(e) => changeTaskStatus(e, task)} />
              <EditableSpan value={task.title} onChange={(title) => changeTaskTitle(task, title)} />
              <button onClick={() => deleteTask(todolist.id, task.id)}>x</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const container: CSSProperties = {
  border: "1px solid black",
  margin: "20px 0",
  padding: "10px",
  width: "330px",
  display: "flex",
  justifyContent: "space-between",
  flexDirection: "column",
}
