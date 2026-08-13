"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Tabs, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogin = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch("https://cross-border-api.onrender.com/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "登录失败");

      localStorage.setItem("token", data.access_token);
      message.success("登录成功");
      router.push("/");
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch("https://cross-border-tool.onrender.com/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "注册失败");

      message.success("注册成功，请登录");
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[400px]">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🚀 火箭跨境铺货工具
        </h1>
        <Form onFinish={onLogin} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, type: "email", message: "请输入正确的邮箱" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="mt-2"
          >
            登录
          </Button>
        </Form>
      </div>
    </div>
  );
}
