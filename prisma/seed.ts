import {
  DocumentType,
  EmployeeRole,
  PrismaClient,
  RoomStatus,
  RoomType,
  ServiceCategory,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin employee
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const managerPassword = await bcrypt.hash('Manager123!', 12);
  const receptionistPassword = await bcrypt.hash('Reception123!', 12);
  const housekeepingPassword = await bcrypt.hash('Housekeeping123!', 12);

  // Employees
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@hotel.com',
      password: adminPassword,
      role: EmployeeRole.ADMIN,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Admin created:', admin.email);

  const manager = await prisma.employee.upsert({
    where: { email: 'manager@hotel.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@hotel.com',
      password: managerPassword,
      role: EmployeeRole.MANAGER,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Manager created:', manager.email);

  const receptionist = await prisma.employee.upsert({
    where: { email: 'reception@hotel.com' },
    update: {},
    create: {
      firstName: 'Jane',
      lastName: 'Receptionist',
      email: 'reception@hotel.com',
      password: receptionistPassword,
      role: EmployeeRole.RECEPTIONIST,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Receptionist created:', receptionist.email);

  const housekeeper = await prisma.employee.upsert({
    where: { email: 'housekeeping@hotel.com' },
    update: {},
    create: {
      firstName: 'Maria',
      lastName: 'Cleaner',
      email: 'housekeeping@hotel.com',
      password: housekeepingPassword,
      role: EmployeeRole.HOUSEKEEPING,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Housekeeping created:', housekeeper.email);

  // Rooms
  const roomsData = [
    // First Floor - Single Rooms
    {
      number: '101',
      floor: 1,
      type: RoomType.SINGLE,
      pricePerNight: 80,
      capacity: 1,
      description: 'Cozy single room with city view',
      amenities: ['WiFi', 'TV', 'Air Conditioning'],
    },
    {
      number: '102',
      floor: 1,
      type: RoomType.SINGLE,
      pricePerNight: 80,
      capacity: 1,
      description: 'Comfortable single room',
      amenities: ['WiFi', 'TV', 'Air Conditioning'],
    },
    {
      number: '103',
      floor: 1,
      type: RoomType.DOUBLE,
      pricePerNight: 120,
      capacity: 2,
      description: 'Spacious double room',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
    },
    {
      number: '104',
      floor: 1,
      type: RoomType.DOUBLE,
      pricePerNight: 120,
      capacity: 2,
      description: 'Double room with garden view',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
    },

    // Second Floor - Twin and Double
    {
      number: '201',
      floor: 2,
      type: RoomType.TWIN,
      pricePerNight: 130,
      capacity: 2,
      description: 'Twin room with separate beds',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
    },
    {
      number: '202',
      floor: 2,
      type: RoomType.TWIN,
      pricePerNight: 130,
      capacity: 2,
      description: 'Twin room with mountain view',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
    },
    {
      number: '203',
      floor: 2,
      type: RoomType.DOUBLE,
      pricePerNight: 140,
      capacity: 2,
      description: 'Premium double room',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe'],
    },
    {
      number: '204',
      floor: 2,
      type: RoomType.DOUBLE,
      pricePerNight: 140,
      capacity: 2,
      description: 'Premium double with balcony',
      amenities: [
        'WiFi',
        'TV',
        'Air Conditioning',
        'Mini Bar',
        'Safe',
        'Balcony',
      ],
    },

    // Third Floor - Family and Deluxe
    {
      number: '301',
      floor: 3,
      type: RoomType.FAMILY,
      pricePerNight: 200,
      capacity: 4,
      description: 'Spacious family room',
      amenities: [
        'WiFi',
        'TV',
        'Air Conditioning',
        'Mini Bar',
        'Safe',
        'Sofa Bed',
      ],
    },
    {
      number: '302',
      floor: 3,
      type: RoomType.FAMILY,
      pricePerNight: 200,
      capacity: 4,
      description: 'Family suite with living area',
      amenities: [
        'WiFi',
        'TV',
        'Air Conditioning',
        'Mini Bar',
        'Safe',
        'Living Room',
      ],
    },
    {
      number: '303',
      floor: 3,
      type: RoomType.DELUXE,
      pricePerNight: 250,
      capacity: 2,
      description: 'Deluxe room with premium amenities',
      amenities: [
        'WiFi',
        'TV',
        'Air Conditioning',
        'Mini Bar',
        'Safe',
        'Jacuzzi',
      ],
    },
    {
      number: '304',
      floor: 3,
      type: RoomType.DELUXE,
      pricePerNight: 250,
      capacity: 2,
      description: 'Deluxe corner room',
      amenities: [
        'WiFi',
        'TV',
        'Air Conditioning',
        'Mini Bar',
        'Safe',
        'Jacuzzi',
        'Panoramic View',
      ],
    },

    // Fourth Floor - Suites
    {
      number: '401',
      floor: 4,
      type: RoomType.SUITE,
      pricePerNight: 350,
      capacity: 2,
      description: 'Executive suite',
      amenities: [
        'WiFi',
        'TV',
        'Air Conditioning',
        'Mini Bar',
        'Safe',
        'Jacuzzi',
        'Living Room',
        'Dining Area',
      ],
    },
    {
      number: '402',
      floor: 4,
      type: RoomType.SUITE,
      pricePerNight: 350,
      capacity: 2,
      description: 'Business suite',
      amenities: [
        'WiFi',
        'TV',
        'Air Conditioning',
        'Mini Bar',
        'Safe',
        'Jacuzzi',
        'Office Desk',
        'Meeting Table',
      ],
    },

    // Fifth Floor - Presidential
    {
      number: '501',
      floor: 5,
      type: RoomType.PRESIDENTIAL,
      pricePerNight: 800,
      capacity: 4,
      description: 'Presidential suite with panoramic views',
      amenities: [
        'WiFi',
        'Smart TV',
        'Air Conditioning',
        'Mini Bar',
        'Safe',
        'Jacuzzi',
        'Private Pool',
        'Butler Service',
        'Kitchen',
      ],
    },
  ];

  for (const roomData of roomsData) {
    const room = await prisma.room.upsert({
      where: { number: roomData.number },
      update: {},
      create: {
        ...roomData,
        status: RoomStatus.AVAILABLE,
        images: [],
      },
    });
    console.log(`✅ Room created: ${room.number}`);
  }

  // Additional Services
  const servicesData = [
    // Restaurant
    {
      name: 'Breakfast Buffet',
      description: 'Full breakfast buffet with international options',
      price: 25,
      category: ServiceCategory.RESTAURANT,
    },
    {
      name: 'Lunch Menu',
      description: 'Three-course lunch menu',
      price: 35,
      category: ServiceCategory.RESTAURANT,
    },
    {
      name: 'Dinner Menu',
      description: 'Five-course dinner experience',
      price: 55,
      category: ServiceCategory.RESTAURANT,
    },
    {
      name: 'In-Room Dining',
      description: '24/7 room service',
      price: 15,
      category: ServiceCategory.ROOM_SERVICE,
    },

    // Spa
    {
      name: 'Relaxing Massage',
      description: '60-minute full body massage',
      price: 80,
      category: ServiceCategory.SPA,
    },
    {
      name: 'Facial Treatment',
      description: 'Deep cleansing facial',
      price: 60,
      category: ServiceCategory.SPA,
    },
    {
      name: 'Spa Package',
      description: 'Full spa day with treatments',
      price: 200,
      category: ServiceCategory.SPA,
    },

    // Transport
    {
      name: 'Airport Transfer',
      description: 'Private car to/from airport',
      price: 50,
      category: ServiceCategory.TRANSPORT,
    },
    {
      name: 'City Tour',
      description: 'Half-day city tour with guide',
      price: 75,
      category: ServiceCategory.TRANSPORT,
    },
    {
      name: 'Car Rental',
      description: 'Daily car rental service',
      price: 100,
      category: ServiceCategory.TRANSPORT,
    },

    // Laundry
    {
      name: 'Express Laundry',
      description: 'Same-day laundry service',
      price: 30,
      category: ServiceCategory.LAUNDRY,
    },
    {
      name: 'Dry Cleaning',
      description: 'Professional dry cleaning',
      price: 20,
      category: ServiceCategory.LAUNDRY,
    },
    {
      name: 'Ironing Service',
      description: 'Per item ironing',
      price: 5,
      category: ServiceCategory.LAUNDRY,
    },

    // Other
    {
      name: 'Late Checkout',
      description: 'Checkout until 4pm',
      price: 50,
      category: ServiceCategory.OTHER,
    },
    {
      name: 'Early Check-in',
      description: 'Check-in from 10am',
      price: 40,
      category: ServiceCategory.OTHER,
    },
    {
      name: 'Pet Fee',
      description: 'Daily fee for pets',
      price: 25,
      category: ServiceCategory.OTHER,
    },
  ];

  for (const serviceData of servicesData) {
    const service = await prisma.additionalService.create({
      data: {
        ...serviceData,
        active: true,
      },
    });
    console.log(`✅ Service created: ${service.name}`);
  }

  // Sample Customers
  const customersData = [
    {
      firstName: 'Carlos',
      lastName: 'García',
      email: 'carlos.garcia@email.com',
      phone: '+34612345678',
      documentType: DocumentType.PASSPORT,
      documentNumber: 'AB1234567',
      address: 'Calle Principal 123, Madrid',
      nationality: 'Spain',
      birthDate: new Date('1985-03-15'),
    },
    {
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.johnson@email.com',
      phone: '+1555123456',
      documentType: DocumentType.PASSPORT,
      documentNumber: 'US9876543',
      address: '456 Oak Street, New York',
      nationality: 'USA',
      birthDate: new Date('1990-07-22'),
    },
    {
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'marco.rossi@email.com',
      phone: '+393312345678',
      documentType: DocumentType.NATIONAL_ID,
      documentNumber: 'IT12345678',
      address: 'Via Roma 45, Rome',
      nationality: 'Italy',
      birthDate: new Date('1978-11-08'),
    },
  ];

  for (const customerData of customersData) {
    const customer = await prisma.customer.upsert({
      where: { email: customerData.email },
      update: {},
      create: customerData,
    });
    console.log(`✅ Customer created: ${customer.email}`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('Admin: admin@hotel.com / Admin123!');
  console.log('Manager: manager@hotel.com / Manager123!');
  console.log('Receptionist: reception@hotel.com / Reception123!');
  console.log('Housekeeping: housekeeping@hotel.com / Housekeeping123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
