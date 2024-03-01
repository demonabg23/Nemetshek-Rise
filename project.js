async function distanceMath(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); // Изчисляване на разстояние
}

async function calculateClosestWarehouse(customerLocation, warehouses) {
    let closestWarehouseIndex = 0;
    let shortestDistance = await distanceMath(customerLocation.x, customerLocation.y, warehouses[0].x, warehouses[0].y);
    
    for (let i = 1; i < warehouses.length; i++) {
        const distance = await distanceMath(customerLocation.x, customerLocation.y, warehouses[i].x, warehouses[i].y);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            closestWarehouseIndex = i;
        }
    }
    
    return closestWarehouseIndex; // най-близкия склад
}

async function calculateDeliveryDistance(warehouse, customerLocation) {
    const distance = await distanceMath(warehouse.x, warehouse.y, customerLocation.x, customerLocation.y); // 1 метър = 1 минута
    return Math.round(distance); 
}

async function calculateDeliveryTimeAndDrones(warehouses, customerOrders, droneTypes, realTimeFactor) {
    let deliveryTime = 0;
    let remainingBatteryCapacities = droneTypes.map(drone => ({type: drone, remainingCapacity: drone.capacity}));
    let totalOrders = customerOrders.length;
    let totalDronesUsed = 0;

    for (let index = 0; index < customerOrders.length; index++) {
        const order = customerOrders[index];
        const closestWarehouseIndex = await calculateClosestWarehouse(order.customerLocation, warehouses);
        const timeTo = await calculateDeliveryDistance(warehouses[closestWarehouseIndex], order.customerLocation);
        const timeAt = index > 0 ? 5 : 0; // Времето за изчакване на склада

        // Дронове
        let chosenDrone;
        for (const drone of remainingBatteryCapacities) {
            if (drone.remainingCapacity * 1000 >= timeTo * drone.type.consumption) {
                chosenDrone = drone;
                break;
            }
        }
        
        if (!chosenDrone) {
            const newDrone = droneTypes.find(drone => drone.capacity * 1000 >= timeTo * drone.consumption);
            if (!newDrone) {
                console.log(`Няма наличен дрон с достатъчно батерия за поръчка ${index + 1}`);
                totalOrders--;
                continue;
            }
            remainingBatteryCapacities.push({type: newDrone, remainingCapacity: newDrone.capacity}); 
            chosenDrone = newDrone;
            totalDronesUsed++;
        }
        
        deliveryTime += timeTo + timeAt;
        chosenDrone.remainingCapacity -= timeTo * chosenDrone.type.consumption;

        // реално време
        await simulateRealTime(timeTo, timeAt, order, realTimeFactor);
    }

    return {  
        totalDeliveryTime: deliveryTime,
        totalOrdersProcessed: totalOrders,
        totalDronesUsed: totalDronesUsed
    };
}

async function main(warehouses, orders, typesOfDrones) {
    try {
        const { totalDeliveryTime, totalOrdersProcessed, totalDronesUsed } = await calculateDeliveryTimeAndDrones(warehouses, orders, typesOfDrones, realTimeFactor);
        
        const averageDeliveryTimePerOrder = totalDeliveryTime / totalOrdersProcessed;
        
        console.log(`Total delivery time: ${totalDeliveryTime}`);
        console.log(`Total orders processed: ${totalOrdersProcessed}`);
        console.log(`Total drones used: ${totalDronesUsed}`);
        console.log(`Average delivery time per order: ${averageDeliveryTimePerOrder}`);
    } catch (error) {
        console.error(`An error occurred in the main loop:`, error);
    }
}


async function simulateRealTime(timeTo, timeAt, order, realTimeFactor){
    console.log(`Изпращане на дрон към клиент ${order.customerId} `);
    await delay(timeTo * 1000 / realTimeFactor);
    console.log(`Дрон достигна клиент ${order.customerId}`);
    console.log(`Клиент ${order.customerId} приема поръчката`);
    await delay(timeAt * 1000 / realTimeFactor);
    console.log(`Дрон се завръща към склада`);
}

function delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}



const inputData = {
    "output": {
        "poweredOn": true,
        "minutes": {
            "program": 10,
            "real": 400
        }
    },
    "map-top-right-coordinate": {
        "x": 280,
        "y": 280
    },
    "products": [
        "tomatoes",
        "cucumber",
        "cheese",
        "milk",
        "ham",
        "eggs",
        "bananas",
        "carrots",
        "bread",
        "onion"
    ],
    "warehouses": [
        {
            "x": 100,
            "y": 100,
            "name": "Left warehouse"
        },
        {
            "x": 200,
            "y": 200,
            "name": "Right warehouse"
        }
    ],
    "customers": [
        {
            "id": 1,
            "name": "John Stocks",
            "coordinates": {
                "x": 10,
                "y": 10
            }
        },
        {
            "id": 2,
            "name": "Alfred Derrick",
            "coordinates": {
                "x": 213,
                "y": 187
            }
        },
        {
            "id": 3,
            "name": "Richard Brune",
            "coordinates": {
                "x": 108,
                "y": 15
            }
        }
    ],
    "orders": [
        {
            "customerId": 1,
            "customerLocation": { "x": 10, "y": 10 },
            "productList": {
                "tomatoes": 5,
                "cucumber": 5,
                "cheese": 1,
                "milk": 2
            }
        },
        {
            "customerId": 1,
            "customerLocation": { "x": 10, "y": 10 },
            "productList": {
                "eggs": 10,
                "cucumber": 2,
                "cheese": 1,
                "ham": 2
            }
        },
        {
            "customerId": 2,
            "customerLocation": { "x": 213, "y": 187 },
            "productList": {
                "eggs": 10,
                "tomatoes": 2,
                "bananas": 5,
                "carrots": 15,
                "bread": 2,
                "onion": 6  
            }
        }
    ],
    "typesOfDrones": [
        { "capacity": 0.5, "consumption": 1 },
        { "capacity": 1, "consumption": 3 },
        { "capacity": 2, "consumption": 5 }
    ]
};

const mapTopRightCoordinate = inputData["map-top-right-coordinate"];
const warehouses = inputData["warehouses"];
const customers = inputData["customers"];
const orders = inputData["orders"];
const typesOfDrones = inputData["typesOfDrones"];


const realTimeFactor = inputData.output.minutes.real / inputData.output.minutes.program;
const totalDeliveryTime = calculateDeliveryTimeAndDrones(warehouses, orders, typesOfDrones, realTimeFactor);
main(warehouses, orders, typesOfDrones);

