'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function markVisit(phone: string, serviceId: string) {
  try {
    // 1. Get the service details for pricing
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true }
    });

    if (!service) throw new Error('Service not found');

    const businessId = service.businessId;

    // 2. Upsert Customer
    const customer = await prisma.customer.upsert({
      where: { 
        phone_businessId: {
          phone,
          businessId
        }
      },
      update: { lastVisit: new Date() },
      create: {
        phone,
        businessId,
        lastVisit: new Date()
      }
    });

    // 3. ROI Logic: Check for recent recovery logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLog = await prisma.recoveryLog.findFirst({
      where: {
        customerId: customer.id,
        businessId,
        status: 'SENT',
        sentAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    let recovered = false;
    if (recentLog) {
      // Mark as RECOVERED!
      await prisma.recoveryLog.update({
        where: { id: recentLog.id },
        data: {
          status: 'RECOVERED',
          recoveredAt: new Date(),
          revenueAmount: service.price
        }
      });
      recovered = true;
    }

    // 4. Record new visit logic (Sprint 3: schedules next reminder)
    // For now, we just return the result
    
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      recovered, 
      revenue: recovered ? service.price : 0,
      customerName: customer.name || phone 
    };
  } catch (error) {
    console.error('Error in markVisit:', error);
    return { success: false, error: 'Failed to mark visit' };
  }
}

export async function getDashboardStats(businessId: string) {
  const [totalRecovered, customersWonBack, activeReminders, logs] = await Promise.all([
    prisma.recoveryLog.aggregate({
      where: { businessId, status: 'RECOVERED' },
      _sum: { revenueAmount: true }
    }),
    prisma.recoveryLog.count({
      where: { businessId, status: 'RECOVERED' }
    }),
    prisma.recoveryLog.count({
      where: { businessId, status: 'SENT' }
    }),
    prisma.recoveryLog.findMany({
      where: { 
        businessId,
        sentAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      select: { sentAt: true, status: true }
    })
  ]);

  // Total reminders sent in last 30 days
  const totalSent = await prisma.recoveryLog.count({
    where: { 
      businessId, 
      sentAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    }
  });

  const recoveryRate = totalSent > 0 ? (customersWonBack / totalSent) * 100 : 0;

  return {
    totalRevenue: totalRecovered._sum.revenueAmount || 0,
    customersWonBack,
    recoveryRate: Math.round(recoveryRate),
    activeReminders,
    chartData: Array.from({ length: 30 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      return {
        date: dateStr,
        sent: logs.filter((l: any) => l.sentAt.toISOString().split('T')[0] === dateStr).length,
        recovered: logs.filter((l: any) => l.status === 'RECOVERED' && l.sentAt.toISOString().split('T')[0] === dateStr).length
      };
    })
  };
}

export async function searchCustomer(phone: string, businessId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { 
        phone_businessId: {
          phone,
          businessId
        }
      },
      select: {
        id: true,
        name: true,
        lastVisit: true,
      }
    });

    return { success: true, customer };
  } catch (error) {
    return { success: false, error: 'Search failed' };
  }
}

export async function onboardBusiness(name: string, niche: string) {
  try {
    const business = await prisma.business.create({
      data: {
        name,
        niche,
        plan: 'FREE',
      }
    });

    // Auto-seed default services based on niche
    const defaultServices = {
      'Salon': [
        { name: 'Haircut', price: 45, recoveryDays: 30 },
        { name: 'Facial', price: 80, recoveryDays: 45 },
        { name: 'Manicure', price: 35, recoveryDays: 21 },
      ],
      'Bike Service': [
        { name: 'Oil Change', price: 60, recoveryDays: 90 },
        { name: 'Full Tune-up', price: 200, recoveryDays: 180 },
        { name: 'Brake Check', price: 40, recoveryDays: 60 },
      ],
      'Pet Grooming': [
        { name: 'Full Groom', price: 75, recoveryDays: 60 },
        { name: 'Bath & Brush', price: 40, recoveryDays: 30 },
        { name: 'Nail Trim', price: 15, recoveryDays: 30 },
      ]
    };

    const servicesToSeed = defaultServices[niche as keyof typeof defaultServices] || defaultServices['Salon'];

    await prisma.service.createMany({
      data: servicesToSeed.map(s => ({
        ...s,
        businessId: business.id
      }))
    });

    return { success: true, businessId: business.id };
  } catch (error) {
    console.error('Onboarding failed:', error);
    return { success: false, error: 'Onboarding failed' };
  }
}

export async function getServices(businessId: string) {
  try {
    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    });
    return { success: true, services };
  } catch (error) {
    return { success: false, error: 'Failed to fetch services' };
  }
}

