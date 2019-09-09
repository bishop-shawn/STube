import ActionType from '../actionType';

const initialState = {
  tasks: [],
  loadingTask: true,
  loadTaskError: null,
  creatingTask: false,
  createError: null,
  subTasks: [],
  loadingSubTask: true,
  loadingSubTaskError: null,
};

export default function Download(state = initialState, action) {
  const { FETCH_ALL_TASKS_ING, FETCH_ALL_TASKS_DONE, FETCH_ALL_TASKS_ERROR, CREATE_TASK_ING, CREATE_TASK_DONE, CREATE_TASK_ERROR, FETCH_SUBTASK_ING, FETACH_SUBTASK_DNOE, FETCH_SUBTASK_ERROR, CLEAR_SUBTASK } = ActionType;

  switch (action.type) {
    case FETCH_ALL_TASKS_ING:
      return {
        ...state,
        loadingTask: true,
        loadTaskError: null,
      };
    case FETCH_ALL_TASKS_DONE:
      return {
        ...state,
        loadingTask: false,
        loadTaskError: null,
        tasks: [...action.data],
      };
    case FETCH_ALL_TASKS_ERROR:
      return {
        ...state,
        loadingTask: false,
        loadTaskError: action.data,
      };
    case CREATE_TASK_ING:
      return {
        ...state,
        creatingTask: true,
        createError: null,
      };
    case CREATE_TASK_DONE:
      return {
        ...state,
        creatingTask: false,
        createError: null,
      };
    case CREATE_TASK_ERROR:
      return {
        ...state,
        creatingTask: false,
        createError: action.data,
      };
    case FETCH_SUBTASK_ING:
      return {
        ...state,
        loadingSubTaskError: null,
        loadingSubTask: true,
      };
    case FETACH_SUBTASK_DNOE:
      return {
        ...state,
        loadingSubTask: false,
        loadingSubTaskError: null,
        subTasks: [...action.data],
      };
    case FETCH_SUBTASK_ERROR:
      return {
        ...state,
        loadingSubTaskError: action.data,
        loadingSubTask: false,
      };
    case CLEAR_SUBTASK:
      return {
        ...state,
        subTasks: [],
        loadingSubTask: false,
        loadingSubTaskError: null,
      };
    default:
      return state;
  }
}
