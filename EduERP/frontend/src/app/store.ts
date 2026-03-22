import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer  from '../features/auth/store/authSlice';
import uiReducer    from '../store/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui:   uiReducer,
    // Feature slices are added here as modules grow:
    // admission:   admissionReducer,
    // students:    studentsReducer,
    // attendance:  attendanceReducer,
    // examination: examinationReducer,
    // fees:        feesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable dates if any are passed in actions
        ignoredActionPaths: ['payload.lastLoginAt'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks — use these everywhere instead of plain useDispatch / useSelector
export const useAppDispatch: () => AppDispatch         = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
