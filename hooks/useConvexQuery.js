import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query, ...args) => {
  const resultData = useQuery(query, ...args);

  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if(resultData === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(resultData);
        setError(null);
      } catch (error) {
        setError(error);
        toast.error(`Error fetching data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [resultData]);

  return {
    data,
    isLoading,
    error
  };
};

export const useConvexMutation = (query) => {
  const mutationData = useMutation(query);

  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await mutationData(...args);
      setData(response);
      return response;
    } catch (error) {
      setError(error);
      toast.error(`Error executing mutation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    data,
    isLoading,
    error
  };
};