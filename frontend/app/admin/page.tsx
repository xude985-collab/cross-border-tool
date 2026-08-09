"use client";
import { useEffect, useState } from "react";
import { Table, Switch, Tag, message, Button } from "antd";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      // 获取当前用户信息
      const meRes = await fetch("https://api.tukeng.com.cn/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error("未登录");
      const me = await meRes.json();
      setCurrentUser(me);

      if (me.role !== "admin") {
        message.error("需要管理员权限");
        router.push("/");
        return;
      }

      // 获取所有用户
      const usersRes = await fetch("https://api.tukeng.com.cn/api/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!usersRes.ok) throw new Error("获取用户列表失败");
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (err: any) {
      message.error(err.message);
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    const token = localStorage.getItem("token");
    const newStatus = currentStatus === "active" ? "disabled" : "active";

    try {
      const res = await fetch(
        `https://api.tukeng.com.cn/api/users/${userId}/status?status=${newStatus}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("操作失败");

      message.success(`用户已${newStatus === "active" ? "启用" : "禁用"}`);
      checkAuth(); // 刷新列表
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "邮箱", dataIndex: "email" },
    { title: "姓名", dataIndex: "full_name" },
    {
      title: "角色",
      dataIndex: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "red" : "blue"}>
          {role === "admin" ? "管理员" : "用户"}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: string, record: any) => (
        <Switch
          checked={status === "active"}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={() => toggleUserStatus(record.id, status)}
          disabled={record.role === "admin" && record.id !== currentUser?.id}
        />
      ),
    },
    {
      title: "注册时间",
      dataIndex: "created_at",
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Button onClick={() => router.push("/")}>返回首页</Button>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
