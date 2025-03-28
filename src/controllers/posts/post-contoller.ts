import { getPagination } from "../../extras/pagination";
import { prisma } from "../../extras/prisma";
import {
  DeletePostError,
  GetPostsError,
  PostStatus,
  type GetPostsResult,
  type PostCreateResult,
} from "./post-type";

export const createPost = async (parameters: {
  title: string;
  content: string;
  authorId: string | undefined; // user id from token or session
}): Promise<PostCreateResult | PostStatus> => {
  try {
    if (!parameters.authorId) {
      return PostStatus.USER_NOT_FOUND;
    }

    const post = await prisma.post.create({
      data: {
        title: parameters.title,
        content: parameters.content,
        author: {
          connect: { id: parameters.authorId },
        },
      },
    });

    return { post };
  } catch (error) {
    console.error(error);
    return PostStatus.POST_CREATION_FAILED;
  }
};

//Get All posts
export const getAllPosts = async (parameters: {
  page: number;
  limit: number;
}): Promise<GetPostsResult> => {
  try {
    const { skip, take } = getPagination(parameters.page, parameters.limit);

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: take,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!posts || posts.length === 0) {
      throw new Error(GetPostsError.NO_POSTS_FOUND);
    }

    return { posts };
  } catch (error) {
    console.error(error);
    throw new Error(GetPostsError.UNKNOWN);
  }
};

//Retreive all the post of specific user
export const getPostsByUser = async (parameters: {
  userId: string;
  page: number;
  limit: number;
}): Promise<GetPostsResult> => {
  try {
    const { skip, take } = getPagination(parameters.page, parameters.limit);
    const posts = await prisma.post.findMany({
      where: {
        userId: parameters.userId,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: take,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    if (!posts || posts.length === 0) {
      throw new Error(GetPostsError.NO_POSTS_FOUND);
    }
    return { posts };
  } catch (error) {
    console.error(error);
    throw new Error(GetPostsError.UNKNOWN);
  }
};

//Delete post

export const deletePost = async (params: {
  postId: string;
  userId: string;
}): Promise<DeletePostError> => {
  try {
    // Check if the post belongs to the user
    const post = await prisma.post.findUnique({
      where: { id: params.postId },
    });

    if (!post) {
      return DeletePostError.POST_NOT_FOUND;
    }

    if (post.userId !== params.userId) {
      return DeletePostError.UNAUTHORIZED;
    }

    await prisma.post.delete({
      where: { id: params.postId },
    });

    return DeletePostError.DELETE_SUCCESS;
  } catch (error) {
    console.error(error);
    return DeletePostError.DELETE_FAILED;
  }
};
