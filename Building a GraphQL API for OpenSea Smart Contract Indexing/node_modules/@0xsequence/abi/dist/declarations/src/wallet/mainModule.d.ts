export declare const abi: ({
    type: string;
    name: string;
    constant: boolean;
    inputs: {
        type: string;
    }[];
    outputs: {
        type: string;
    }[];
    payable: boolean;
    stateMutability: string;
} | {
    type: string;
    name: string;
    constant: boolean;
    inputs: ({
        components: {
            type: string;
            name: string;
        }[];
        type: string;
    } | {
        type: string;
        components?: undefined;
    })[];
    outputs: never[];
    payable: boolean;
    stateMutability: string;
} | {
    type: string;
    name: string;
    inputs: {
        type: string;
    }[];
    payable: boolean;
    stateMutability: string;
    constant?: undefined;
    outputs?: undefined;
})[];
