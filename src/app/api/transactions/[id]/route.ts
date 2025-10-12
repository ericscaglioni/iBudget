import { authHandler } from "@/lib/middlewares";
import { transactionService } from "@/lib/server/services";
import { NextResponse } from "next/server";

export const PATCH = authHandler(async ({ userId, request, params }) => {
  const { id } = await params ?? {};
  const body = await request.json();
  const {
    type,
    amount,
    accountId,
    categoryId,
    description,
    date,
    updateScope,
  } = body;

  // Validate updateScope parameter if provided
  if (updateScope && updateScope !== 'one' && updateScope !== 'future') {
    return NextResponse.json(
      { error: 'Invalid updateScope parameter. Must be "one" or "future".' },
      { status: 400 }
    );
  }

  try {
    const result = await transactionService.updateTransaction(
      userId,
      {
        id,
        type,
        amount,
        accountId,
        categoryId,
        description,
        date,
      },
      updateScope ? { updateScope } : undefined
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    
    // Handle specific error types
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    if (error.message?.includes('not recurring')) {
      return NextResponse.json(
        { error: 'Cannot update future transactions: transaction is not recurring' },
        { status: 400 }
      );
    }

    if (error.message?.includes('date is missing')) {
      return NextResponse.json(
        { error: 'Cannot update future transactions: transaction date is missing' },
        { status: 400 }
      );
    }
    
    // Re-throw for other errors to be handled by error handler
    throw error;
  }
});

export const DELETE = authHandler(async ({ userId, request, params }) => {
  const { id } = await params ?? {};
  
  // Extract scope from query params
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  
  // Validate scope parameter if provided
  if (scope && scope !== 'future') {
    return NextResponse.json(
      { error: 'Invalid scope parameter. Must be "future" or omitted.' },
      { status: 400 }
    );
  }
  
  try {
    await transactionService.deleteTransaction(
      userId,
      id as string,
      scope === 'future' ? { scope: 'future' } : undefined
    );
    
    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    // Handle specific error types
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    if (error.message?.includes('not recurring')) {
      return NextResponse.json(
        { error: 'Cannot delete future transactions: transaction is not recurring' },
        { status: 400 }
      );
    }
    
    // Re-throw for other errors to be handled by error handler
    throw error;
  }
});