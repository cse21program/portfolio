import { afterAll, beforeEach } from "vitest";
import { prisma } from "@common/database/prisma";
import { clearOutbox } from "@common/mailer/mailer";

beforeEach(async () => {
  clearOutbox();
  await prisma.contactMessage.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.paymentProviderSetting.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.education.deleteMany();
  await prisma.project.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.tutorial.deleteMany();
  await prisma.course.deleteMany();
  await prisma.service.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.field.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
