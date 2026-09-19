const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative grid w-[50px] aspect-square rounded-full border-4 border-transparent border-t-[#ccc] animate-spin">
        <div
          className="absolute inset-0 m-[2px] rounded-full border-4
                    border-transparent border-t-blue-600 dark:border-t-red-600    
                    animate-[spin_0.5s_linear_reverse_infinite]"
        ></div>

        <div
          className="absolute inset-0 m-[8px] rounded-full border-4 
                    border-transparent border-t-[#ccc]
                    animate-spin"
        ></div>
      </div>
    </div>
  );
};

export default Loading;
