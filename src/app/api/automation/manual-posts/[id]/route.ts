import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const { data: post, error } = await supabase
      .from('manual_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching manual post:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch manual post' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const body = await request.json();
    const { action, ...updateData } = body;

    let updateFields: any = {};

    switch (action) {
      case 'cancel':
        updateFields = { 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        };
        break;
      
      case 'resend':
        updateFields = { 
          status: 'scheduled',
          updated_at: new Date().toISOString()
        };
        break;
      
      default:
        // Regular update
        updateFields = {
          ...updateData,
          updated_at: new Date().toISOString()
        };
    }

    const { data: updatedPost, error } = await supabase
      .from('manual_posts')
      .update(updateFields)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: `Manual post ${action || 'updated'} successfully`
    });
  } catch (error) {
    console.error('Error updating manual post:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update manual post' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const { error } = await supabase
      .from('manual_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Manual post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting manual post:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete manual post' 
    }, { status: 500 });
  }
}