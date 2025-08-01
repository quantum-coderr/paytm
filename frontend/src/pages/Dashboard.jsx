import { useEffect, useState } from "react";
import axios from "axios";
import { Appbar } from "../components/Appbar"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"

export const Dashboard = () => {
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await axios.get("http://localhost:3000/api/v1/account/balance", {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    }
                });

                setBalance(response.data.balance);
            } catch (err) {
                console.error("Error fetching balance", err);
                setBalance("Error");
            }
        };

        fetchBalance();
    }, []);

    return (
        <div>
            <Appbar />
            <div className="m-8">
                <Balance balance={balance !== null ? `₹${balance.toFixed(2)}` : "Loading..."} />
                <Users />
            </div>
        </div>
    );
};
