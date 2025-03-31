export const PlusOutlined = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 1024 1024"
    fill="currentColor"
    style={{ verticalAlign: "text-bottom" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M480 112m32 0l0 800q0 32-32 32t-32-32l0-800q0-32 32-32t32 32Z"
      stroke="currentColor"
      strokeWidth="64"
      strokeLinecap="round"
    />
    <path
      d="M144 480m32 0l672 0q32 0 32 32t-32 32l-672 0q-32 0-32-32t32-32Z"
      stroke="currentColor"
      strokeWidth="64"
      strokeLinecap="round"
    />
  </svg>
);

export const MinusCircleOutlined: React.FC<{ className?: string,style: any }> = ({ className,style }) => {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 1024 1024"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: "text-bottom" }}
      {...style}
    >
      <path d="M512 64C265.07 64 64 265.07 64 512s201.07 448 448 448 448-201.07 448-448S758.93 64 512 64z m192 480H320a32 32 0 0 1 0-64h384a32 32 0 0 1 0 64z" />
    </svg>
  );
};

export const DownloadOutlined = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 1024 1024"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: "text-bottom" }}
  >
    <path d="M505.5 659.8c-5.2 0-10.3-2-14.2-5.9L327.1 490.5c-7.9-7.9-7.9-20.5 0-28.3 7.9-7.9 20.5-7.9 28.3 0L485 591.8V168c0-11.1 9-20 20-20s20 9 20 20v423.8l129.6-129.6c7.9-7.9 20.5-7.9 28.3 0 7.9 7.9 7.9 20.5 0 28.3L519.8 653.9c-3.9 3.9-9.1 5.9-14.3 5.9zM832 792c-11.1 0-20 9-20 20v44H212v-44c0-11.1-9-20-20-20s-20 9-20 20v64c0 22.1 17.9 40 40 40h640c22.1 0 40-17.9 40-40v-64c0-11-9-20-20-20z" />
  </svg>
);;
