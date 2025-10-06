import { NextResponse } from 'next/server';
import { AppError } from '../errors/AppError';

type ApiResponse<T> = {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};

export const createSuccessResponse = <T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> => {
  return NextResponse.json({ data }, { status });
};

export const createErrorResponse = (error: unknown): NextResponse<ApiResponse<never>> => {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    { status: 500 }
  );
}; 