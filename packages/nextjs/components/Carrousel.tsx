"use client";

import React, { ReactNode } from "react";

type CarrouselProps = {
  title: string;
  children: ReactNode;
};

const Carrousel = (props: CarrouselProps) => {
  return (
    <>
      <div>
        <span>{props.title}</span>
      </div>
      <div className="carrousel">{props.children}</div>
    </>
  );
};

export default Carrousel;
