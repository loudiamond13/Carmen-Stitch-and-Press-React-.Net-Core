
import type {
    Discount,
    Expense,
    ExpenseResponse,
    HomePageResponse,
    LoginRequest,
    LoginResponse,
    Order,
    OrderItem,
    OrderResponse,
    OrderType,
    Payment,
    Status,
    User,
    VerificationRequest
} from "./api-types";
import type { GetExpensesSchema, GetHomePageSchema, GetOrdersSchema } from "../lib/search-params";
import qs from "qs";



const fetchApi = {
    get: async (endpoint: string, params?: Record<string, any>) => {
        const queryString = params ? `?${qs.stringify(params, { arrayFormat: "indices", allowDots: true })}` : "";
        const res = await fetch(`/api${endpoint}${queryString}`, {
            method: "GET",
            credentials: "include"
        });

        return res;
    },
    post: async (endpoint: string, body?: any, isMultipart = false) => {

        const options: RequestInit = {
            method: "POST",
            credentials: "include",
            headers: {}
        }

        if (body !== undefined) {
            if (!isMultipart) {
                options.headers = { 'Content-Type': "application/json" }
                options.body = JSON.stringify(body);
            }
            else {
                options.body = body;
            }
        }

        const res = await fetch(`/api${endpoint}`, options);

        return res;
    },
    patch: async (endpoint: string, body?: any, isMultipart = false) => {
        const options: RequestInit = {
            method: "PATCH",
            credentials: "include",
            headers: {}
        }

        if (body !== undefined) {
            if (!isMultipart) {
                options.headers = { 'Content-Type': "application/json" }
                options.body = JSON.stringify(body);
            }
            else {
                options.body = body;
            }
        }

        const res = await fetch(`/api${endpoint}`, options);

        return res;
    },
    delete: async (endpoint: string, params?: Record<string, any>) => {

        const queryString = params ? `?${qs.stringify(params, { arrayFormat: "indices", allowDots: true })}` : "";

        const res = await fetch(`/api${endpoint}${queryString}`, {
            method: "DELETE",
            credentials: "include"
        });

        return res;
    }
}


async function getErrorMessage(res: Response, fallback: string): Promise<string> {
    try {
        const contentType = res.headers.get('Content-Type') ?? ''

        if (contentType.includes('application/json')) {
            const data = await res.json()

            // ASP.NET ModelState: { errors: { Field: ['message'] } }
            if (data?.errors) {
                const messages = Object.values(data.errors).flat()
                return (messages as string[]).join('\n')
            }

            // simple message field
            if (data?.message) return data.message

            // plain string JSON
            if (typeof data === 'string') return data
        }

        // plain text response
        if (contentType.includes('text/plain')) {
            return await res.text()
        }
    }
    catch {

    }
    return fallback;
}




export const getCurrentUser = async (): Promise<User | null> => {


    const res = await fetchApi.get("/identity/current-user");

    if (res.status === 401) {
        return null;
    }
    return res.json();

}


export const login = async (loginRequest: LoginRequest): Promise<LoginResponse> => {

    const res = await fetchApi.post('/identity/login', loginRequest);

    if (!res.ok) {
        const message = await getErrorMessage(res, "Login failed.");
        throw new Error(message);
    }

    return res.json();

}

export const verifyCode = async (verificationRequest: VerificationRequest): Promise<number> => {

    const res = await fetchApi.post("/identity/verify-code", verificationRequest);

    if (!res.ok) {
        const message = await getErrorMessage(res, "Verification failed.");
        throw new Error(message);
    }

    return res.status;
}

export const logout = async () => {

    const res = await fetchApi.post("/identity/logout");

    if (!res.ok) {
        const message = await getErrorMessage(res, "Logout failed.");
        throw new Error(message);
    }

    return res.status;
}


export const getOrders = async (params: GetOrdersSchema): Promise<OrderResponse> => {

    const filters: object[] = [];

    if (params.orderName) {
        filters.push({
            id: "OrderName",
            operator: "contains",
            value: params.orderName
        });
    }

    const res = await fetchApi.get('/order/getOrders', {
        pageNumber: params.page,
        pageSize: params.perPage,
        filters,
        sort: params.sort,
    });

    if (!res.ok) {
        const message = await getErrorMessage(res, "Failed to fetch orders.");
        throw new Error(message);
    }

    return res.json();
}


export const getAllOrderStatuses = async (): Promise<Status[]> => {
    const res = await fetchApi.get('/order/get-all-order-statuses')

    if (!res.ok) throw new Error('Failed to fetch order statuses')

    return res.json()
}

export const getAllAdminUsers = async (): Promise<User[]> => {
    const res = await fetchApi.get('/user/get-all-admin-users')

    if (!res.ok) throw new Error('Failed to fetch admin users')

    return res.json()
}

export const getAllOrderTypes = async (): Promise<OrderType[]> => {
    const res = await fetchApi.get('/order/get-all-order-types')

    if (!res.ok) throw new Error('Failed to fetch order types')

    return res.json()
}


export const createOrder = async (orderData: FormData) => {

    const res = await fetchApi.post("/order/create-order", orderData, true);

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error while creating order.')
        throw new Error(message);
    }

    return res.json();

}

export const getOrderById = async (orderId: string): Promise<Order> => {

    const res = await fetchApi.get(`/order/get-order-by-id/${orderId}`)

    if (!res.ok) throw new Error('Failed to fetch order details')

    return res.json()
}

export const updateOrder = async (orderData: FormData) => {

    const res = await fetchApi.patch("/order/update-order", orderData, true);

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error while updating order.')
        throw new Error(message);
    }

    return res.json();

}



//export const uploadImage = async(file:File) => {
//    try {
//        const res = await api.get('/order/get-cloudinary-signature');

//        if (!res || res.status !== 200) {
//            throw new Error("Unable to connect to cloudinary");
//        }

//        const { signature, timestamp, apiKey, cloudName } = res.data;

//        const formData = new FormData();
//        formData.append("file", file);
//        formData.append("folder", "Orders");
//        formData.append("signature", signature);
//        formData.append("timestamp", timestamp);
//        formData.append("api_key", apiKey);

//        const response = await axios.post(
//            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
//            formData,
//            {
//                headers: { "Content-Type": "multipart/form-data" },
//            }
//        );

//        return response.data;
//    }
//    catch (error) {
//        throw new Error("Failed to upload image");
//    }
//}


// order payment -------------------------------------------------------------------------------------------------
export const createOrderPayment = async (data: Payment) => {


    const res = await fetchApi.post("/order/create-order-payment", data);

    if (!res.ok) {
        const message = await getErrorMessage(res, "Unexpected error occurred on creating order payment.");
        throw new Error(message);
    }

    return res.json();


};

export const updateOrderPayment = async (data: Payment) => {

    const res = await fetchApi.patch("/order/update-order-payment", data);

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error on updating order payment.')
        throw new Error(message);
    }


    return res.json();


}


export const deleteOrderPayment = async (paymentId: number) => {

    const res = await fetchApi.delete("/order/delete-order-payment", { paymentId });

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error on deleting order payment.')
        throw new Error(message);
    }

    return res.json();


}
// end order payment -------------------------------------------------------------------------------------------------



// order item -------------------------------------------------------------------------------------------------------
export const createOrderOrderItem = async (data: OrderItem) => {

    const res = await fetchApi.post("/order/create-order-item", data);

    if (!res.ok) {
        const message = await getErrorMessage(res, "Unexpected error occurred on creating order item.");
        throw new Error(message);
    }

    return res.json();

}


export const updateOrderItem = async (data: OrderItem) => {

    const res = await fetchApi.patch("/order/update-order-item", data);

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error on updating order item.')
        throw new Error(message);
    }

    return res.json();


}


export const deleteOrderItem = async (orderItemId: number) => {

    const res = await fetchApi.delete("/order/delete-order-item", { orderItemId });

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error on deleting order item.')
        throw new Error(message);
    }

    return res.json();

}

// end order item -------------------------------------------------------------------------------------------------


// discount --------------------------------------------------------------------------------------------------------
export const createOrderDiscount = async (data: Discount) => {

    const res = await fetchApi.post("/order/create-order-discount", data);

    if (!res.ok) {
        const message = await getErrorMessage(res, "Unexpected error occurred on creating order discount.");
        throw new Error(message);
    }

    return res.json();
}

export const updateOrderDiscount = async (discount: Discount) => {

    const res = await fetchApi.patch("/order/update-order-discount", discount);

    if (!res.ok) {
        const message = await getErrorMessage(res, "Unexpected error occured while updating order discount.");
        throw new Error(message);
    }

    return res.json();
}

export const deleteOrderDiscount = async (discountId: number) => {

    const res = await fetchApi.delete("/order/delete-order-discount", { discountId });

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error on deleting order discount.')
        throw new Error(message);
    }

    return res.json();

}
//end order discount --------------------------------------------------------------------------------------

//expense -------------------------------------------------------------------------------------------------
export const createOrderExpense = async (data: Expense) => {

    const res = await fetchApi.post("/order/create-order-expense", data);

    if (!res.ok) {
        const message = await getErrorMessage(res, "Unexpected error occurred on creating order expense.");
        throw new Error(message);
    }

    return res.json();
}

export const createCompanyExpense = async (data: Expense) => {

    const res = await fetchApi.post("/order/create-company-expense", data);

    if (!res.ok) {
        const message = await getErrorMessage(res, "Unexpected error occurred on creating company expense.");
        throw new Error(message);
    }

    return res.json();
}

export const updateExpense = async (data: Expense) => {


    const res = await fetchApi.patch("/order/update-expense", data);

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error on updating expense.')
        throw new Error(message);
    }

    return res.json();


}

export const deleteExpense = async (expenseId: number) => {

    const res = await fetchApi.delete("/order/delete-expense", { expenseId });

    if (!res.ok) {
        const message = await getErrorMessage(res, 'Unexpected error on deleting expense.')
        throw new Error(message);
    }
}


export const getExpenses = async (params: GetExpensesSchema): Promise<ExpenseResponse> => {

    const filters: object[] = [];

    if (params.spentDate.length > 0) {
        filters.push({
            id: "SpentDate",
            operator: ">=",
            value: String(params.spentDate[0])
        });
        filters.push({
            id: "SpentDate",
            operator: "<",
            value: String(params.spentDate[1])
        });
    }

    if (params.description) {
        filters.push({
            id: "Description",
            operator: "contains",
            value: params.description
        })
    }



    const res = await fetchApi.get('/order/get-expenses', {
        pageNumber: params.page,
        pageSize: params.perPage,
        filters,
        sort: params.sort,
    });

    if (!res.ok) throw new Error('Unexpected error occurred on getting expenses.')

    return res.json();

}
//end expense -------------------------------------------------------------------------------------------------


export const getDistinctYears = async (params: GetHomePageSchema): Promise<HomePageResponse> => {


    const res = await fetchApi.get("/home/authorized-home", {
        year: params.year
    });

    if (!res.ok) throw new Error('Unexpected error on getting home settings.');

    return res.json();
}