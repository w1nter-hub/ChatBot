import { HttpException, HttpStatus } from '@nestjs/common';
import { UserSparse } from '../user/user.schema';
import { KnowledgebaseSparse, UserRoles } from './knowledgebase.schema';

export enum UserPermissions {
  READ = 'read',
  EDIT = 'edit',
  DELETE = 'delete',
  INVITE_USER = 'invite_user',
  DELETE_USER = 'delete_user',
}

const rolePermissions = {
  [UserRoles.READER]: [UserPermissions.READ],
  [UserRoles.EDITOR]: [UserPermissions.READ, UserPermissions.EDIT],
  [UserRoles.ADMIN]: [
    UserPermissions.READ,
    UserPermissions.EDIT,
    UserPermissions.DELETE,
    UserPermissions.INVITE_USER,
    UserPermissions.DELETE_USER,
  ],
};

export function checkUserPermissionForKb(
  user: UserSparse,
  kb: KnowledgebaseSparse,
  requiredPermissions?: string[],
) {
  if (!kb) {
    throw new HttpException('Invalid Knowledgebase Id', HttpStatus.NOT_FOUND);
  }
  if (!user._id.equals(kb.owner)) {
    
    
    if (kb.participants) {
      
      const userRoleObj = kb.participants.find(
        (obj) => obj.id.toString() === user._id.toString(),
      );
      if (userRoleObj) {
        const userPermissions = rolePermissions[userRoleObj.role];

        if (requiredPermissions) {
          
          const hasPermission = requiredPermissions.every(
            (permission: UserPermissions) =>
              userPermissions.includes(permission),
          );

          if (!hasPermission) {
            throw new HttpException('Unauthorised', HttpStatus.UNAUTHORIZED);
          }
        }
      } else {
        throw new HttpException('Unauthorised', HttpStatus.UNAUTHORIZED);
      }
    } else {
      throw new HttpException('Unauthorised', HttpStatus.UNAUTHORIZED);
    }
  }
}
