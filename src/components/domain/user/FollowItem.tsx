import React from "react";
import UserCard, { UserCardProps } from "../user/UserCard";

/**
 * FollowItem — 팔로워/팔로잉 행
 * UserCard의 row 레이아웃을 그대로 사용하는 얇은 래퍼 (variant 통합)
 * state: default · hover
 */
export type FollowItemProps = Omit<UserCardProps, "layout">;

export function FollowItem(props: FollowItemProps) {
  return <UserCard {...props} layout="row" />;
}

export default FollowItem;
