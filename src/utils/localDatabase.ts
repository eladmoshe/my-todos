import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TodoAppSchema extends DBSchema {
  sections: {
    key: number;
    value: {
      id: number;
      title: string;
      order: number;
      last_edited: string;
    };
  };
  todos: {
    key: number;
    value: {
      id: number;
      text: string;
      completed: boolean;
      section_id: number;
      created_at: string;
      completed_at: string | null;
      last_edited: string;
    };
  };
}

let db: IDBPDatabase<TodoAppSchema> | null = null;

export async function openLocalDatabase() {
  if (!db) {
    db = await openDB<TodoAppSchema>('TodoApp', 1, {
      upgrade(db) {
        db.createObjectStore('sections', { keyPath: 'id' });
        db.createObjectStore('todos', { keyPath: 'id' });
      },
    });
  }
  return db;
}

export const getLocalSections = async (): Promise<any[]> => {
  const db = await openLocalDatabase();
  return db.getAll('sections');
};

export const getLocalTodos = async (): Promise<any[]> => {
  const db = await openLocalDatabase();
  return db.getAll('todos');
};

export async function saveLocalSection(section: TodoAppSchema['sections']['value']) {
  const database = await openLocalDatabase();
  await database.put('sections', section);
}

export async function saveLocalTodo(todo: TodoAppSchema['todos']['value']) {
  const database = await openLocalDatabase();
  await database.put('todos', todo);
}

export async function deleteLocalSection(id: number) {
  const database = await openLocalDatabase();
  await database.delete('sections', id);
}

export async function deleteLocalTodo(id: number) {
  const database = await openLocalDatabase();
  await database.delete('todos', id);
}
